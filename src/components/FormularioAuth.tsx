"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Estado } from "@/app/actions/auth";

type Campo = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };

export default function FormularioAuth({
  titulo,
  acao,
  campos,
  botao,
  rodape,
}: {
  titulo: string;
  acao: (e: Estado, f: FormData) => Promise<Estado>;
  campos: Campo[];
  botao: string;
  rodape: { texto: string; link: string; href: string };
}) {
  const [estado, formAction, pendente] = useActionState(acao, undefined);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <Link href="/" className="text-xl font-bold text-primary">
          Oásis
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{titulo}</h1>

        <form action={formAction} className="mt-6 space-y-4">
          {campos.map((c) => (
            <label key={c.name} className="block text-sm font-medium">
              {c.label}
              <input
                name={c.name}
                type={c.type ?? "text"}
                autoComplete={c.autoComplete}
                placeholder={c.placeholder}
                defaultValue={estado?.valores?.[c.name]}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </label>
          ))}

          {estado?.erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {estado.erro}
            </p>
          )}

          <button
            disabled={pendente}
            className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {pendente ? "Aguarde..." : botao}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {rodape.texto}{" "}
          <Link href={rodape.href} className="font-semibold text-primary hover:underline">
            {rodape.link}
          </Link>
        </p>
      </div>
    </main>
  );
}
