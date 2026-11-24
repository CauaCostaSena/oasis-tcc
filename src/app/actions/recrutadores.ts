"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { empresaSemPerfil, entrarComoRecrutador, sairDoPerfil } from "@/lib/session";
import type { Estado } from "./auth";

const PIN_VALIDO = /^\d{4}$/;

export async function escolherPerfil(_: Estado, f: FormData): Promise<Estado> {
  const empresa = await empresaSemPerfil();
  const r = empresa.recrutadores.find((x) => x.id === Number(f.get("id")));
  // shortcut: sem limite de tentativas no PIN; adicionar bloqueio temporário antes de produção.
  if (!r || !(await bcrypt.compare(String(f.get("pin") ?? ""), r.pinHash))) return { erro: "PIN incorreto." };
  await entrarComoRecrutador(r.id);
  redirect("/painel");
}

export async function criarPerfil(_: Estado, f: FormData): Promise<Estado> {
  const empresa = await empresaSemPerfil();
  const nome = String(f.get("nome") ?? "").trim().slice(0, 40);
  const pin = String(f.get("pin") ?? "");
  const valores = { nome };

  if (nome.length < 2) return { erro: "Informe o nome do recrutador.", valores };
  if (!PIN_VALIDO.test(pin)) return { erro: "O PIN deve ter 4 números.", valores };
  const limite = empresa.plano.limiteRecrutadores;
  if (limite >= 0 && empresa.recrutadores.length >= limite) {
    return { erro: `Seu plano permite até ${limite} perfis de recrutador.`, valores };
  }

  const { id } = await db.recrutador.create({
    data: { empresaId: empresa.id, nome, pinHash: await bcrypt.hash(pin, 10) },
  });
  await entrarComoRecrutador(id);
  redirect("/painel");
}

export async function trocarPerfil() {
  await sairDoPerfil();
  redirect("/perfis");
}
