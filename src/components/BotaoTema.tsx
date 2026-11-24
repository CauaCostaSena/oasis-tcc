"use client";

import { Moon, Sun } from "lucide-react";

/** Alterna escuro/claro. O ícone troca por CSS (data-tema no <html>), então não há estado a hidratar. */
export default function BotaoTema() {
  function alternar() {
    const d = document.documentElement;
    const claro = d.dataset.tema !== "claro";
    if (claro) d.dataset.tema = "claro";
    else delete d.dataset.tema;
    try {
      localStorage.setItem("tema", claro ? "claro" : "escuro");
    } catch {}
  }
  return (
    <button onClick={alternar} aria-label="Alternar tema claro ou escuro" className="btn btn-ghost btn-icone">
      <Sun size={18} className="tema-escuro-so" />
      <Moon size={18} className="tema-claro-so" />
    </button>
  );
}
