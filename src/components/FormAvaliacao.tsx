"use client";

import { useActionState } from "react";
import { salvarAvaliacao } from "@/app/actions/candidatos";

const campo =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft";

export default function FormAvaliacao({ login }: { login: string }) {
  const [estado, acao, pendente] = useActionState(salvarAvaliacao.bind(null, login), undefined);

  return (
    <form action={acao} className="space-y-3">
      <label className="block text-sm font-medium">
        Nota (opcional)
        <select name="nota" defaultValue={estado?.valores?.nota ?? ""} className={`${campo} sm:w-40`}>
          <option value="">Sem nota</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Observação privada
        <textarea
          name="texto"
          rows={3}
          maxLength={2000}
          required
          defaultValue={estado?.valores?.texto}
          placeholder="Visível só para a sua empresa."
          className={campo}
        />
      </label>
      {estado?.erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      <button
        disabled={pendente}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pendente ? "Salvando..." : "Salvar avaliação"}
      </button>
    </form>
  );
}
