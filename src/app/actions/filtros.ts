"use server";

import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { normalizar } from "@/lib/filtros";
import { empresaAtual } from "@/lib/session";

const MAX_FILTROS = 20;

/** Guarda a seleção atual como "filtro personalizado" do recrutador. Devolve a mensagem de erro, se houver. */
export async function salvarFiltro(nomeBruto: string, bruto: Record<string, unknown>): Promise<string | undefined> {
  const { recrutador } = await empresaAtual();
  const nome = nomeBruto.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!nome) return "Dê um nome ao filtro.";
  if ((await db.filtroSalvo.count({ where: { recrutadorId: recrutador.id } })) >= MAX_FILTROS) {
    return `Limite de ${MAX_FILTROS} filtros personalizados atingido.`;
  }
  await db.filtroSalvo.create({ data: { recrutadorId: recrutador.id, nome, filtros: normalizar(bruto) } });
  refresh();
}

export async function excluirFiltro(id: number) {
  const { recrutador } = await empresaAtual();
  await db.filtroSalvo.deleteMany({ where: { id, recrutadorId: recrutador.id } });
  refresh();
}

export async function marcarNotificacoesVistas() {
  const { recrutador } = await empresaAtual();
  await db.recrutador.update({ where: { id: recrutador.id }, data: { notificacoesVistasEm: new Date() } });
  refresh();
}
