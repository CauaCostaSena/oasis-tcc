import Image from "next/image";
import Link from "next/link";
import { BookMarked, BookmarkCheck, Building2, Check, MapPin, Users } from "lucide-react";
import type { Perfil } from "@/lib/github";
import BotaoFavorito from "./BotaoFavorito";

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

const Dado = ({ v, l, Icone }: { v: number; l: string; Icone: typeof BookMarked }) => (
  <span className="flex items-center gap-1.5" title={`${v.toLocaleString("pt-BR")} ${l.toLowerCase()}`}>
    <Icone size={14} className="text-muted" aria-hidden />
    <span className="font-semibold tabular-nums">{compacto.format(v)}</span>
    <span className="text-muted">{l}</span>
  </span>
);

export default function CardCandidato({
  p,
  favorito,
  aviso,
  similar,
}: {
  p: Perfil;
  favorito: boolean;
  aviso?: string; // "Já salvo na pasta X por Y": liga a borda neon laranja
  similar?: { pct: number; pontos: string[] }; // aba Semelhantes
}) {
  return (
    <div className={`h-full ${aviso ? "neon-salvo" : ""}`}>
      {/* O nome é um link esticado: o card inteiro abre o perfil; o favorito fica por cima (z-10). */}
      <article className="card card-hover relative flex h-full flex-col gap-3 p-4">
        <div className="absolute right-3 top-3 z-10">
          <BotaoFavorito login={p.login} favorito={favorito} />
        </div>

        <div className="flex items-center gap-3 pr-11">
          <Image src={p.avatar} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full border border-border bg-surface-2" />
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight">
              <Link href={`/candidato/${p.login}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-[var(--r-card)] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-primary">
                {p.nome ?? p.login}
              </Link>
            </h3>
            <p className="truncate text-sm text-muted">@{p.login}</p>
          </div>
        </div>

        {(similar || aviso || p.disponivel) && (
          <div className="flex flex-wrap items-center gap-2">
            {similar && <span className="chip display text-sm">{similar.pct}% semelhante</span>}
            {p.disponivel && <span className="chip chip-neutro">Disponível para contratação</span>}
            {aviso && (
              <span className="selo-salvo max-w-full">
                <BookmarkCheck size={12} className="shrink-0" />
                <span className="truncate">{aviso}</span>
              </span>
            )}
          </div>
        )}

        {similar ? (
          <ul className="flex-1 space-y-1.5 text-sm text-muted">
            {similar.pontos.length === 0 && <li>Poucos pontos em comum com o perfil modelo.</li>}
            {similar.pontos.map((ponto) => (
              <li key={ponto} className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-primary" /> {ponto}
              </li>
            ))}
          </ul>
        ) : (
          <p className="line-clamp-2 flex-1 text-sm text-muted">{p.bio ?? "Sem biografia informada."}</p>
        )}

        {(p.localizacao || p.empresa) && (
          <p className="flex min-w-0 items-center gap-x-3 text-xs text-muted">
            {p.localizacao && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin size={12} className="shrink-0" aria-hidden />
                <span className="truncate">{p.localizacao}</span>
              </span>
            )}
            {p.empresa && (
              <span className="flex min-w-0 items-center gap-1">
                <Building2 size={12} className="shrink-0" aria-hidden />
                <span className="truncate">{p.empresa}</span>
              </span>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
          <Dado v={p.repos} l="repositórios" Icone={BookMarked} />
          <Dado v={p.seguidores} l="seguidores" Icone={Users} />
        </div>
      </article>
    </div>
  );
}
