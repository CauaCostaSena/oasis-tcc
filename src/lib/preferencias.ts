import "server-only";
import { db } from "./db";
import { normalizar } from "./filtros";

/** Filtros personalizados do recrutador, já validados (o JSON do banco passa pelo mesmo filtro da URL). */
export async function filtrosSalvos(recrutadorId: number) {
  const lista = await db.filtroSalvo.findMany({ where: { recrutadorId }, orderBy: { criadoEm: "asc" } });
  return lista.map((s) => ({ id: s.id, nome: s.nome, filtros: normalizar(s.filtros as Record<string, unknown>) }));
}

/** De quem é cada favorito e em que pasta está: usado para avisar "já salvo". */
export async function favoritosDe(empresaId: number, logins: string[]) {
  const favs = await db.favorito.findMany({
    where: { empresaId, githubLogin: { in: logins } },
    include: { pasta: true, recrutador: true },
  });
  return new Map(
    favs.map((f) => [
      f.githubLogin,
      `Já salvo ${f.pasta ? `na pasta “${f.pasta.nome}”` : "nos favoritos"}${f.recrutador ? ` por ${f.recrutador.nome}` : ""}`,
    ]),
  );
}
