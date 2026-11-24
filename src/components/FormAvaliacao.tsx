"use client";

import { useActionState, useTransition } from "react";
import { Lock, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirAvaliacao, salvarAvaliacao } from "@/app/actions/candidatos";
import type { Estado } from "@/app/actions/auth";
import { Switch } from "./Controles";

export default function FormAvaliacao({ login }: { login: string }) {
  const [estado, acao, pendente] = useActionState(async (anterior: Estado, f: FormData) => {
    const r = await salvarAvaliacao(login, anterior, f);
    if (r?.erro) toast.error(r.erro);
    else toast.success(f.get("privada") === "1" ? "Comentário privado salvo: só você vê." : "Comentário salvo para a empresa.");
    return r;
  }, undefined);

  return (
    <form action={acao} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium">Nota (opcional)</legend>
        {/* Estrelas em ordem inversa no HTML para o CSS pintar "esta e as anteriores" com o seletor ~. */}
        <div className="-ml-1 mt-1 flex flex-row-reverse justify-end">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="an-estrela peer cursor-pointer p-1 text-border hover:scale-110 hover:text-amber-500 has-[:checked]:text-amber-500 peer-hover:text-amber-500 peer-has-[:checked]:text-amber-500">
              <input type="radio" name="nota" value={n} defaultChecked={estado?.valores?.nota === String(n)} className="sr-only" />
              <Star size={28} fill="currentColor" aria-hidden />
              <span className="sr-only">Nota {n}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        Comentário
        <textarea
          name="texto"
          rows={3}
          maxLength={2000}
          required
          defaultValue={estado?.valores?.texto}
          placeholder="O que chamou a atenção neste candidato?"
          className="field mt-1"
        />
      </label>
      {estado?.erro && (
        <p role="alert" className="alerta">
          {estado.erro}
        </p>
      )}
      <label className="flex cursor-pointer items-center gap-3 rounded-[var(--r-controle)] border border-border p-3 text-sm transition-colors hover:border-primary">
        <Switch name="privada" value="1" defaultChecked={estado?.valores?.privada === "1"} />
        <span>
          <span className="flex items-center gap-1.5 font-medium">
            <Lock size={14} /> Manter privado
          </span>
          <span className="block text-xs text-muted">
            Desligado: os outros recrutadores da empresa veem. Ligado: só você vê.
          </span>
        </span>
      </label>
      <div className="flex gap-2">
        <button disabled={pendente} aria-busy={pendente} className="btn btn-primary">
          {pendente ? "Salvando..." : "Salvar comentário"}
        </button>
        <button type="reset" className="btn btn-ghost">
          Limpar
        </button>
      </div>
    </form>
  );
}

export function BotaoExcluirAvaliacao({ id }: { id: number }) {
  const [pendente, iniciar] = useTransition();
  return (
    <button
      disabled={pendente}
      aria-busy={pendente}
      onClick={() =>
        iniciar(async () => {
          await excluirAvaliacao(id);
          toast.success("Comentário excluído.");
        })
      }
      className="btn btn-ghost !px-2.5 text-xs hover:!bg-danger-soft hover:!text-danger"
    >
      <Trash2 size={14} /> {pendente ? "Excluindo..." : "Excluir"}
    </button>
  );
}
