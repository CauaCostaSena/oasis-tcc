"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { alternarFavorito } from "@/app/actions/candidatos";

export default function BotaoFavorito({
  login,
  favorito,
  rotulo,
}: {
  login: string;
  favorito: boolean;
  rotulo?: boolean; // texto ao lado do ícone (página de perfil)
}) {
  const [erro, acao, pendente] = useActionState(async () => {
    const e = await alternarFavorito(login);
    if (e) toast.error(e);
    else toast.success(favorito ? `@${login} removido dos favoritos.` : `@${login} salvo nos favoritos.`);
    return e;
  }, undefined);

  return (
    <form action={acao}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        disabled={pendente}
        aria-pressed={favorito}
        aria-label={favorito ? "Remover dos favoritos" : "Favoritar"}
        className={`btn ${favorito ? "btn-primary" : "btn-outline"} ${rotulo ? "" : "btn-icone"}`}
      >
        <motion.span
          key={String(favorito)}
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex"
        >
          <Bookmark size={18} fill={favorito ? "currentColor" : "none"} />
        </motion.span>
        {rotulo && (favorito ? "Favoritado" : "Favoritar")}
      </motion.button>
      {erro && (
        <p role="alert" className="alerta mt-1 !px-2 !py-1 text-xs">
          {erro}
        </p>
      )}
    </form>
  );
}
