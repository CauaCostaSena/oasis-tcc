"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Plus, X } from "lucide-react";
import { criarPerfil, escolherPerfil } from "@/app/actions/recrutadores";

type R = { id: number; nome: string };

function Carregando({ texto }: { texto: string }) {
  return (
    <>
      <Loader2 className="girando" aria-hidden /> {texto}
    </>
  );
}

function FormPin({ id, nome }: { id: number; nome: string }) {
  const [estado, acao, pendente] = useActionState(escolherPerfil, undefined);
  const pin = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (estado?.erro) pin.current?.focus();
  }, [estado]);
  return (
    <form action={acao} aria-busy={pendente} className="mx-auto mt-8 max-w-xs space-y-3">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="rotulo">PIN de {nome}</span>
        <input
          ref={pin}
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="••••"
          autoComplete="off"
          aria-describedby={estado?.erro ? "erro-pin" : undefined}
          autoFocus
          required
          className="field pin-campo mt-1.5"
        />
      </label>
      {estado?.erro && (
        <p id="erro-pin" role="alert" className="alerta">
          {estado.erro}
        </p>
      )}
      <button disabled={pendente} className="btn btn-primary w-full !min-h-11">
        {pendente ? <Carregando texto="Entrando" /> : "Entrar"}
      </button>
    </form>
  );
}

function FormNovo({ podeCriar, limite }: { podeCriar: boolean; limite: number }) {
  const [estado, acao, pendente] = useActionState(criarPerfil, undefined);
  const nome = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (estado?.erro) nome.current?.focus();
  }, [estado]);
  if (!podeCriar) {
    return <p className="mt-8 text-center text-sm text-muted">Seu plano permite até {limite} perfis de recrutador.</p>;
  }
  return (
    <form action={acao} aria-busy={pendente} className="mx-auto mt-8 max-w-xs space-y-4 text-left">
      <label className="block">
        <span className="rotulo">Nome do recrutador</span>
        <input
          ref={nome}
          name="nome"
          defaultValue={estado?.valores?.nome}
          aria-describedby={estado?.erro ? "erro-novo" : undefined}
          required
          className="field !min-h-11 mt-1.5"
        />
      </label>
      <label className="block">
        <span className="rotulo">PIN de 4 números</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="••••"
          autoComplete="new-password"
          aria-describedby={estado?.erro ? "erro-novo" : undefined}
          required
          className="field pin-campo mt-1.5"
        />
      </label>
      {estado?.erro && (
        <p id="erro-novo" role="alert" className="alerta">
          {estado.erro}
        </p>
      )}
      <button disabled={pendente} className="btn btn-primary w-full !min-h-11">
        {pendente ? <Carregando texto="Criando" /> : "Criar perfil"}
      </button>
    </form>
  );
}

const TONS = ["from-teal-400 to-teal-700", "from-cyan-400 to-sky-700", "from-lime-400 to-emerald-700", "from-amber-300 to-orange-600"];

export default function SelecaoPerfil({ recrutadores, limite }: { recrutadores: R[]; limite: number }) {
  const [aberto, setAberto] = useState<number | "novo" | null>(recrutadores.length === 0 ? "novo" : null);
  const podeCriar = limite < 0 || recrutadores.length < limite;
  const reduzir = useReducedMotion();
  const atual = recrutadores.find((r) => r.id === aberto);

  const tile = "group flex w-24 flex-col items-center gap-3 rounded-2xl text-sm font-medium";
  return (
    <>
      <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-8">
        {recrutadores.map((r, i) => (
          <li key={r.id}>
            <button onClick={() => setAberto(r.id)} className={tile} aria-pressed={aberto === r.id}>
              <span
                className={`perfil-avatar display flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-bold text-white ${TONS[i % TONS.length]} ${
                  aberto === r.id ? "ring-4 ring-primary ring-offset-4 ring-offset-background" : "opacity-80 group-hover:opacity-100"
                }`}
              >
                {r.nome[0].toUpperCase()}
              </span>
              <span className="w-full truncate">{r.nome}</span>
            </button>
          </li>
        ))}
        <li>
          <button onClick={() => setAberto(aberto === "novo" ? null : "novo")} className={tile} aria-pressed={aberto === "novo"}>
            <span
              className={`perfil-avatar flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed ${
                aberto === "novo" ? "border-primary text-primary" : "border-border text-muted group-hover:border-primary group-hover:text-primary"
              }`}
            >
              {aberto === "novo" ? <X size={24} /> : <Plus size={24} />}
            </span>
            <span className="text-muted">Adicionar</span>
          </button>
        </li>
      </ul>

      <AnimatePresence mode="wait">
        {aberto !== null && (
          <motion.div
            key={aberto}
            initial={reduzir ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduzir ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {aberto === "novo" ? <FormNovo podeCriar={podeCriar} limite={limite} /> : <FormPin id={aberto} nome={atual?.nome ?? ""} />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
