"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";

// Valores e limites provisórios. Anual = 12 meses com 20% de desconto.
const PLANOS = [
  { nome: "Gratuito", mensal: 0, itens: ["20 buscas por mês", "10 favoritos", "2 perfis de recrutador", "Comparação de até 2 candidatos"] },
  { nome: "Profissional", mensal: 149, destaque: true, itens: ["200 buscas por mês", "100 favoritos", "10 perfis de recrutador", "Comparação de até 4 candidatos"] },
  { nome: "Empresarial", mensal: 499, itens: ["Buscas ilimitadas", "Favoritos ilimitados", "Perfis de recrutador ilimitados", "Comparação de até 6 candidatos", "Suporte prioritário"] },
];

const anual = (m: number) => Math.round(m * 12 * 0.8);
const reais = (n: number) => n.toLocaleString("pt-BR");

// Conta do valor antigo até o novo em ~600 ms; sem movimento para quem prefere menos animação.
function Valor({ alvo }: { alvo: number }) {
  const [v, setV] = useState(alvo);
  const atual = useRef(alvo);

  useEffect(() => {
    const de = atual.current;
    if (de === alvo || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      atual.current = alvo;
      setV(alvo);
      return;
    }
    const ini = performance.now();
    let raf = requestAnimationFrame(function passo(t) {
      const k = Math.min((t - ini) / 600, 1);
      atual.current = Math.round(de + (alvo - de) * (1 - (1 - k) ** 3));
      setV(atual.current);
      if (k < 1) raf = requestAnimationFrame(passo);
    });
    return () => cancelAnimationFrame(raf);
  }, [alvo]);

  return <span className="tabular-nums">R$ {reais(v)}</span>;
}

export default function Planos() {
  const [ano, setAno] = useState(false);

  return (
    <>
      <div className="mt-8 flex justify-center">
        <div role="group" aria-label="Periodicidade" className="relative inline-flex rounded-full border border-border bg-surface p-1">
          {[false, true].map((anual) => (
            <button
              key={String(anual)}
              onClick={() => setAno(anual)}
              aria-pressed={ano === anual}
              className={`relative rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${ano === anual ? "text-on-primary" : "text-muted"}`}
            >
              {ano === anual && (
                <motion.span layoutId="periodo" className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{anual ? "Anual · economize 20%" : "Mensal"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLANOS.map((p) => (
          <div
            key={p.nome}
            className={`card flex h-full flex-col p-7 ${p.destaque ? "!border-primary" : ""}`}
          >
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                {p.nome}
                {p.destaque && <span className="chip">Popular</span>}
              </h3>
              <p className="display mt-3 text-4xl font-bold">
                <Valor alvo={ano ? anual(p.mensal) : p.mensal} />
                <span className="ml-1 font-sans text-sm font-normal text-muted">{p.mensal === 0 ? "" : ano ? "/ano" : "/mês"}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
                {p.itens.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check size={16} className="shrink-0 text-primary" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/cadastro" className={`btn mt-8 ${p.destaque ? "btn-primary" : "btn-outline"}`}>
                Escolher
              </Link>
          </div>
        ))}
      </div>
    </>
  );
}
