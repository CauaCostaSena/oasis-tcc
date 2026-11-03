"use client";

import { useActionState } from "react";
import { alternarFavorito } from "@/app/actions/candidatos";

export default function BotaoFavorito({ login, favorito }: { login: string; favorito: boolean }) {
  const [erro, acao, pendente] = useActionState(() => alternarFavorito(login), undefined);

  return (
    <form action={acao}>
      <button
        disabled={pendente}
        aria-pressed={favorito}
        className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          favorito
            ? "border-primary bg-primary text-white hover:bg-primary-hover"
            : "border-border bg-surface hover:bg-primary-soft"
        }`}
      >
        {favorito ? "★ Favoritado" : "☆ Favoritar"}
      </button>
      {erro && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {erro}
        </p>
      )}
    </form>
  );
}
