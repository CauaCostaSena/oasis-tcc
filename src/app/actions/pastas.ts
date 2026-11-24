"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { LOGIN_VALIDO } from "@/lib/github";
import { empresaAtual } from "@/lib/session";

const MAX_PASTAS = 30;
const nomeLimpo = (n: string) => n.trim().replace(/\s+/g, " ").slice(0, 40);

// Todas devolvem a mensagem de erro, se houver. O empresaId nos filtros impede mexer em pasta de outra empresa.

export async function criarPasta(nomeBruto: string): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const nome = nomeLimpo(nomeBruto);
  if (!nome) return "Dê um nome à pasta.";
  if ((await db.pasta.count({ where: { empresaId: empresa.id } })) >= MAX_PASTAS) {
    return `Limite de ${MAX_PASTAS} pastas atingido.`;
  }
  await db.pasta.create({ data: { empresaId: empresa.id, nome } });
  refresh();
}

export async function renomearPasta(id: number, nomeBruto: string): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const nome = nomeLimpo(nomeBruto);
  if (!nome) return "Dê um nome à pasta.";
  const { count } = await db.pasta.updateMany({ where: { id, empresaId: empresa.id }, data: { nome } });
  if (!count) return "Pasta não encontrada.";
  refresh();
}

/** Os favoritos da pasta não são apagados: voltam para "Sem pasta" (onDelete: SetNull). */
export async function excluirPasta(id: number): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const { count } = await db.pasta.deleteMany({ where: { id, empresaId: empresa.id } });
  if (!count) return "Pasta não encontrada.";
  refresh();
}

export async function moverFavorito(login: string, pastaId: number | null): Promise<string | undefined> {
  const empresa = await empresaAtual();
  if (!LOGIN_VALIDO.test(login)) return "Usuário inválido.";
  const pasta = pastaId === null ? null : await db.pasta.findFirst({ where: { id: pastaId, empresaId: empresa.id } });
  if (pastaId !== null && !pasta) return "Pasta não encontrada.";
  const { count } = await db.favorito.updateMany({
    where: { empresaId: empresa.id, githubLogin: login },
    data: { pastaId, recrutadorId: empresa.recrutador.id },
  });
  if (!count) return "Favorito não encontrado.";
  // Avisa os outros recrutadores da empresa (aparece no sino deles).
  if (pasta) {
    await db.notificacao.create({
      data: {
        empresaId: empresa.id,
        autorId: empresa.recrutador.id,
        texto: `${empresa.recrutador.nome} adicionou @${login} à pasta “${pasta.nome}”.`,
        link: `/favoritos?pasta=${pasta.id}`,
      },
    });
  }
  refresh();
}
