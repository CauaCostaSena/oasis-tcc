"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { loginsDaUrl, montarComparacao } from "@/lib/comparacao";
import { db } from "@/lib/db";
import { chaveLogins, metricasValidas } from "@/lib/metricas";
import { empresaAtual } from "@/lib/session";

/** Salva a comparação com a foto dos números de agora. Devolve a mensagem de erro, se houver. */
export async function salvarComparacao(logins: string[], metricas: string[], titulo: string): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const validos = loginsDaUrl(logins, empresa.plano.limiteComparar);
  if (validos.length < 2) return "Escolha pelo menos 2 candidatos para salvar a comparação.";
  let itens;
  try {
    itens = await montarComparacao(validos);
  } catch {
    return "Não foi possível consultar o GitHub agora. Tente novamente em alguns instantes.";
  }
  if (itens.length < 2) return "Um dos candidatos não foi encontrado no GitHub.";

  const { id } = await db.comparacao.create({
    data: {
      empresaId: empresa.id,
      recrutadorId: empresa.recrutador.id,
      titulo: titulo.trim().slice(0, 80) || itens.map((i) => `@${i.perfil.login}`).join(" × "),
      logins: chaveLogins(itens.map((i) => i.perfil.login)),
      metricas: metricasValidas(metricas),
      dados: itens,
    },
  });
  redirect(`/comparacoes/${id}`);
}

/** Só quem fez a comparação pode excluí-la. */
export async function excluirComparacao(id: number): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const { count } = await db.comparacao.deleteMany({
    where: { id, empresaId: empresa.id, recrutadorId: empresa.recrutador.id },
  });
  if (!count) return "Só quem fez a comparação pode excluí-la.";
  redirect("/comparacoes");
}

export async function comentarComparacao(id: number, textoBruto: string): Promise<string | undefined> {
  const empresa = await empresaAtual();
  const texto = textoBruto.trim();
  if (!texto) return "Escreva o comentário.";
  if (texto.length > 2000) return "O comentário pode ter até 2000 caracteres.";
  if (!(await db.comparacao.findFirst({ where: { id, empresaId: empresa.id } }))) return "Comparação não encontrada.";
  await db.comentarioComparacao.create({ data: { comparacaoId: id, recrutadorId: empresa.recrutador.id, texto } });
  refresh();
}

export async function excluirComentario(id: number) {
  const empresa = await empresaAtual();
  await db.comentarioComparacao.deleteMany({
    where: { id, recrutadorId: empresa.recrutador.id, comparacao: { empresaId: empresa.id } },
  });
  refresh();
}
