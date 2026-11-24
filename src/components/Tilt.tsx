"use client";

import { useRef } from "react";

/** Card 3D: inclina na direção do cursor e mostra um brilho que o segue. Só reage a mouse. */
export default function Tilt({
  children,
  className = "",
  max = 9,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number; // inclinação máxima em graus
}) {
  const ref = useRef<HTMLDivElement>(null);

  function mover(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.dataset.ativo = "";
    el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  }

  function sair() {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.ativo;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} onPointerMove={mover} onPointerLeave={sair} className={`tilt ${className}`}>
      <div className="tilt-in rounded-2xl">
        {children}
        <span aria-hidden className="tilt-brilho" />
      </div>
    </div>
  );
}
