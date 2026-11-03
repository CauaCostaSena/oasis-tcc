import Image from "next/image";
import Link from "next/link";
import type { Perfil } from "@/lib/github";
import BotaoFavorito from "./BotaoFavorito";

export default function CardCandidato({ p, favorito }: { p: Perfil; favorito: boolean }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <Image src={p.avatar} alt="" width={48} height={48} className="rounded-full" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{p.nome ?? p.login}</h3>
          <p className="truncate text-sm text-muted">@{p.login}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{p.bio ?? "Sem biografia informada."}</p>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <div>📍 {p.localizacao ?? "Localização não informada"}</div>
        <div>{p.repos} repositórios</div>
        <div>{p.seguidores} seguidores</div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/candidato/${p.login}`}
          className="rounded-lg border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          Ver perfil
        </Link>
        <BotaoFavorito login={p.login} favorito={favorito} />
      </div>
    </article>
  );
}
