import Image from "next/image";
import Link from "next/link";
import { METRICAS, type ItemComparacao, type Metrica } from "@/lib/metricas";

// Cada candidato tem uma cor fixa (--serie-N em globals.css), na ordem em que entrou na comparação.
const cor = (i: number) => `var(--serie-${(i % 6) + 1})`;

type Numerica = { id: Metrica; rotulo: string; curto: string; numero: (i: ItemComparacao) => number };

/** Radar: cada eixo vai de 0 ao maior valor entre os candidatos naquela métrica. */
function Radar({ itens, metricas }: { itens: ItemComparacao[]; metricas: Numerica[] }) {
  const R = 100;
  const n = metricas.length;
  const ponto = (k: number, r: number) => {
    const a = (-90 + (k * 360) / n) * (Math.PI / 180);
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  };
  const maximos = metricas.map((m) => Math.max(...itens.map(m.numero), 0));

  return (
    <svg viewBox="-210 -140 420 280" role="img" aria-label="Gráfico radar comparando os candidatos nas métricas numéricas" className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={metricas.map((_, k) => ponto(k, R * f).join(",")).join(" ")}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {metricas.map((m, k) => {
        const [x, y] = ponto(k, R);
        const [lx, ly] = ponto(k, R + 14);
        return (
          <g key={m.id}>
            <line x1={0} y1={0} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx) < 8 ? "middle" : lx > 0 ? "start" : "end"}
              dominantBaseline={ly < -8 ? "auto" : ly > 8 ? "hanging" : "middle"}
              fontSize={11}
              fontWeight={500}
              fill="var(--muted)"
            >
              {m.curto}
            </text>
          </g>
        );
      })}
      {itens.map((item, i) => {
        const pts = metricas.map((m, k) => ponto(k, maximos[k] ? (m.numero(item) / maximos[k]) * R : 0));
        return (
          <g key={item.perfil.login} className="an-radar-serie" style={{ "--s": i } as React.CSSProperties}>
            <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={cor(i)} fillOpacity={0.12} stroke={cor(i)} strokeWidth={2} strokeLinejoin="round" />
            {pts.map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r={4.5} fill={cor(i)} stroke="var(--surface)" strokeWidth={2}>
                <title>{`@${item.perfil.login} · ${metricas[k].rotulo}: ${metricas[k].numero(item).toLocaleString("pt-BR")}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Gráficos e tabela de uma comparação. Serve tanto para a prévia quanto para a comparação salva. */
export default function ComparacaoView({ itens, metricas }: { itens: ItemComparacao[]; metricas: Metrica[] }) {
  const numericas = metricas.flatMap((id): Numerica[] => {
    const m = METRICAS[id];
    return "numero" in m ? [{ id, rotulo: m.rotulo, curto: m.curto, numero: m.numero }] : [];
  });
  const textos = metricas.flatMap((id) => {
    const m = METRICAS[id];
    return "texto" in m ? [{ id, rotulo: m.rotulo, texto: m.texto }] : [];
  });

  // Linguagens: as 7 mais presentes somando todos; cada célula é a fatia dos repositórios próprios do candidato.
  const totais = new Map<string, number>();
  for (const i of itens) for (const [l, q] of i.analise.linguagens) totais.set(l, (totais.get(l) ?? 0) + q);
  const linguagens = [...totais].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([l]) => l);
  const fatia = (i: ItemComparacao, l: string) => {
    const soma = i.analise.linguagens.reduce((s, [, q]) => s + q, 0);
    return soma ? (new Map(i.analise.linguagens).get(l) ?? 0) / soma : 0;
  };

  const temRadar = numericas.length >= 3 && itens.length >= 2;

  return (
    <div className="space-y-6">
      {/* Legenda: a cor identifica o candidato em todos os gráficos; o nome vem sempre junto. */}
      <ul className="flex flex-wrap gap-3">
        {itens.map((item, i) => (
          <li key={item.perfil.login} className="card flex min-w-0 items-center gap-3 px-3 py-2">
            <span aria-hidden className="h-8 w-1.5 rounded-full" style={{ background: cor(i) }} />
            <Image src={item.perfil.avatar} alt="" width={36} height={36} className="rounded-full" />
            <span className="min-w-0 max-w-[12rem]">
              <Link href={`/candidato/${item.perfil.login}`} className="block truncate text-sm font-semibold hover:text-primary">
                {item.perfil.nome ?? item.perfil.login}
              </Link>
              <span className="block truncate text-xs text-muted">@{item.perfil.login}</span>
            </span>
          </li>
        ))}
      </ul>

      {numericas.length > 0 && (
        <div className={temRadar ? "grid items-start gap-4 lg:grid-cols-2" : ""}>
          {temRadar && (
            <figure className="card p-5 lg:sticky lg:top-6">
              <figcaption className="text-sm font-semibold">Visão geral</figcaption>
              <Radar itens={itens} metricas={numericas} />
              <p className="mt-2 text-xs text-muted">
                Cada eixo vai de zero ao maior valor entre os candidatos naquela métrica. Passe o mouse (ou toque e segure) nos
                pontos para ver o número.
              </p>
            </figure>
          )}
          <div className={`grid gap-4 ${temRadar ? "" : "sm:grid-cols-2"}`}>
            {numericas.map((m) => {
              const max = Math.max(...itens.map(m.numero), 0);
              return (
                <figure key={m.id} className="card p-5">
                  <figcaption className="text-sm font-semibold">{m.rotulo}</figcaption>
                  <ul className="mt-3 space-y-2">
                    {itens.map((item, i) => {
                      const v = m.numero(item);
                      return (
                        <li key={item.perfil.login} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-xs sm:grid-cols-[6.5rem_1fr]" title={`@${item.perfil.login}: ${v.toLocaleString("pt-BR")}`}>
                          <span className="truncate text-muted">@{item.perfil.login}</span>
                          <span className="flex items-center gap-2">
                            <span className="an-barra h-3.5 rounded-r" style={{ width: `${max ? Math.max((v / max) * 78, 0.5) : 0.5}%`, background: cor(i), "--s": i } as React.CSSProperties} />
                            <span className="font-mono font-semibold tabular-nums">{v.toLocaleString("pt-BR")}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </figure>
              );
            })}
          </div>
        </div>
      )}

      {metricas.includes("linguagens") && linguagens.length > 0 && (
        <figure className="card overflow-x-auto p-5">
          <figcaption className="text-sm font-semibold">Linguagens: fatia dos repositórios próprios de cada candidato</figcaption>
          <table className="mt-3 w-full min-w-[28rem] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th />
                {itens.map((item) => (
                  <th key={item.perfil.login} scope="col" className="px-2 pb-1 font-medium text-muted">
                    @{item.perfil.login}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linguagens.map((l) => (
                <tr key={l}>
                  <th scope="row" className="pr-2 text-right font-medium">
                    {l}
                  </th>
                  {itens.map((item) => {
                    const f = fatia(item, l);
                    return (
                      <td
                        key={item.perfil.login}
                        className="rounded-lg px-2 py-2 font-mono"
                        // Uma cor só, mais forte quanto maior a fatia; limitada a 45% para o número continuar legível.
                        style={{ background: `color-mix(in srgb, var(--primary) ${Math.round(f * 45)}%, var(--surface-2))` }}
                      >
                        {f ? `${Math.round(f * 100)}%` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )}

      {(textos.length > 0 || numericas.length > 0) && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Tabela com todas as métricas escolhidas</caption>
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 w-44 bg-surface p-4" />
                {itens.map((item) => (
                  <th key={item.perfil.login} scope="col" className="p-4 font-semibold">
                    @{item.perfil.login}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ...numericas.map((m) => ({ ...m, texto: (i: ItemComparacao) => m.numero(i).toLocaleString("pt-BR") })),
                ...textos,
              ].map((m) => (
                <tr key={m.id} className="border-b border-border transition-colors last:border-0 hover:bg-primary-soft">
                  <th scope="row" className="sticky left-0 bg-surface p-4 align-top font-medium text-muted">
                    {m.rotulo}
                  </th>
                  {itens.map((item) => (
                    <td key={item.perfil.login} className="p-4 align-top">
                      {m.texto(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted">
        A comparação apoia a análise e não indica o melhor candidato. Os números vêm de dados públicos do GitHub (100
        repositórios mais recentes, sem forks) e não medem competência.
      </p>
    </div>
  );
}
