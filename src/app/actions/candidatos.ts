"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { LOGIN_VALIDO } from "@/lib/github";
import { empresaAtual } from "@/lib/session";
import type { Estado } from "./auth";

/** Liga/desliga o favorito. Limite -1 = ilimitado. Devolve a mensagem de erro, se houver. */
export async function alternarFavorito(login: string): Promise<string | undefined> {
  const empresa = await empresaAtual();
  if (!LOGIN_VALIDO.test(login)) return "Usuário inválido.";
  const chave = { empresaId_githubLogin: { empresaId: empresa.id, githubLogin: login } };

  if (await db.favorito.findUnique({ where: chave })) {
    await db.favorito.delete({ where: chave });
  } else {
    const limite = empresa.plano.limiteFavoritos;
    if (limite >= 0 && (await db.favorito.count({ where: { empresaId: empresa.id } })) >= limite) {
      return `Limite de ${limite} favoritos do seu plano atingido.`;
    }
    await db.favorito.create({ data: { empresaId: empresa.id, githubLogin: login, recrutadorId: empresa.recrutador.id } });
  }
  refresh();
}

export async function salvarAvaliacao(login: string, _: Estado, f: FormData): Promise<Estado> {
  const empresa = await empresaAtual();
  if (!LOGIN_VALIDO.test(login)) return { erro: "Usuário inválido." };

  const texto = String(f.get("texto") ?? "").trim();
  const notaBruta = String(f.get("nota") ?? "");
  const nota = notaBruta ? Number(notaBruta) : null;
  const privada = f.get("privada") === "1";
  const valores = { texto, nota: notaBruta, privada: privada ? "1" : "" };

  if (!texto) return { erro: "Escreva a observação.", valores };
  if (texto.length > 2000) return { erro: "A observação pode ter até 2000 caracteres.", valores };
  if (nota !== null && !(Number.isInteger(nota) && nota >= 1 && nota <= 5)) {
    return { erro: "A nota deve ser de 1 a 5.", valores };
  }

  await db.avaliacao.create({ data: { empresaId: empresa.id, recrutadorId: empresa.recrutador.id, githubLogin: login, nota, texto, privada } });
  refresh();
}

export async function excluirAvaliacao(id: number) {
  const empresa = await empresaAtual();
  // Só o autor exclui (ou qualquer um, se o perfil do autor foi removido); o empresaId barra outras empresas.
  await db.avaliacao.deleteMany({
    where: { id, empresaId: empresa.id, OR: [{ recrutadorId: empresa.recrutador.id }, { recrutadorId: null }] },
  });
  refresh();
}
