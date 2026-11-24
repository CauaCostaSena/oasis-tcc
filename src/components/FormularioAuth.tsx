"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import type { Estado } from "@/app/actions/auth";
import BotaoTema from "./BotaoTema";
import Logo from "./Logo";

type Campo = { name: string; label: string; type?: string; autoComplete?: string; placeholder?: string };

const ID_ERRO = "erro-auth";

// Máscara visual; o servidor descarta o que não é dígito.
function mascaraCnpj(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

// Reaplica a máscara sem jogar o cursor para o fim: ele fica depois do mesmo número de dígitos.
function aplicarMascara(el: HTMLInputElement) {
  const digitos = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, "").length;
  el.value = mascaraCnpj(el.value);
  let i = 0;
  for (let d = 0; i < el.value.length && d < digitos; i++) if (/\d/.test(el.value[i])) d++;
  el.setSelectionRange(i, i);
}

// Linguagens em barras: ilustrativo, só para mostrar como o resultado aparece.
const LINGUAGENS = [
  ["TypeScript", "72%"],
  ["Python", "38%"],
  ["Go", "21%"],
] as const;

function CampoTexto({ c, valor, comErro }: { c: Campo; valor?: string; comErro: boolean }) {
  const senha = c.type === "password";
  const cnpj = c.name === "cnpj";
  const [visivel, setVisivel] = useState(false);
  return (
    <label className="block text-sm font-medium">
      {c.label} <span aria-hidden className="text-danger">*</span>
      <span className="relative mt-1.5 block">
        <input
          name={c.name}
          type={senha && visivel ? "text" : (c.type ?? "text")}
          autoComplete={c.autoComplete}
          placeholder={c.placeholder}
          defaultValue={valor}
          inputMode={cnpj ? "numeric" : undefined}
          onChange={cnpj ? (e) => aplicarMascara(e.currentTarget) : undefined}
          aria-describedby={comErro ? ID_ERRO : undefined}
          required
          className={`field !min-h-11 font-normal ${senha ? "pr-12" : ""}`}
        />
        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visivel}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted transition-colors hover:text-primary"
          >
            {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

export default function FormularioAuth({
  titulo,
  subtitulo,
  acao,
  campos,
  botao,
  rodape,
}: {
  titulo: string;
  subtitulo: string;
  acao: (e: Estado, f: FormData) => Promise<Estado>;
  campos: Campo[];
  botao: string;
  rodape: { texto: string; link: string; href: string };
}) {
  const [estado, formAction, pendente] = useActionState(acao, undefined);
  const form = useRef<HTMLFormElement>(null);

  // O erro também fica na página (role="alert"); o aviso só chama a atenção e o foco volta ao primeiro campo.
  useEffect(() => {
    if (!estado?.erro) return;
    toast.error(estado.erro);
    form.current?.querySelector("input")?.focus();
  }, [estado]);

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside aria-hidden className="relative hidden items-center justify-center overflow-hidden border-r border-border bg-surface px-12 lg:flex">
        <div className="w-full max-w-sm">
          <p className="display text-3xl font-bold leading-tight">Encontre desenvolvedores no GitHub.</p>
          <div className="card mt-10 bg-background p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
                <UserRound size={20} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">@usuario-exemplo</p>
                <p className="text-xs text-muted">Linguagens mais usadas</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {LINGUAGENS.map(([nome, pct]) => (
                <li key={nome}>
                  <p className="mb-1.5 text-xs text-muted">{nome}</p>
                  <div className="barra">
                    <span style={{ width: pct }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-xs text-muted">Exemplo ilustrativo de como um candidato aparece nos resultados.</p>
        </div>
      </aside>

      <div className="relative flex items-center justify-center px-6 pb-12 pt-24">
        <div className="absolute inset-x-6 top-5 flex items-center justify-between">
          <Link href="/" className="btn btn-ghost !px-3">
            <ArrowLeft size={16} /> Início
          </Link>
          <BotaoTema />
        </div>

        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-3xl font-bold">{titulo}</h1>
          <p className="subtitulo mt-2">{subtitulo}</p>

          <form ref={form} action={formAction} aria-busy={pendente} className="mt-8 space-y-5">
            {campos.map((c) => (
              <CampoTexto key={c.name} c={c} valor={estado?.valores?.[c.name]} comErro={!!estado?.erro} />
            ))}

            {estado?.erro && (
              <p id={ID_ERRO} role="alert" className="alerta">
                {estado.erro}
              </p>
            )}

            <button disabled={pendente} className="btn btn-primary w-full !min-h-11">
              {pendente ? (
                <>
                  <Loader2 className="girando" aria-hidden /> Aguarde
                </>
              ) : (
                <>
                  {botao} <ArrowRight size={16} className="seta" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-muted">
            {rodape.texto}{" "}
            <Link href={rodape.href} className="font-semibold text-primary hover:underline">
              {rodape.link}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
