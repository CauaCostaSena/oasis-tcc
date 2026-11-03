import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "./db";

const COOKIE = "oasis_sessao";
const DURACAO_S = 60 * 60 * 24 * 7;

const assinar = (v: string) =>
  createHmac("sha256", process.env.SESSION_SECRET!).update(v).digest("base64url");

export async function criarSessao(empresaId: number) {
  const valor = `${empresaId}.${Math.floor(Date.now() / 1000) + DURACAO_S}`;
  (await cookies()).set(COOKIE, `${valor}.${assinar(valor)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURACAO_S,
    path: "/",
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

/** Id da empresa logada, ou null se a sessão não existir, for adulterada ou expirou. */
export async function empresaIdAtual(): Promise<number | null> {
  const c = (await cookies()).get(COOKIE)?.value;
  const partes = c?.split(".");
  if (!partes || partes.length !== 3) return null;
  const [id, exp, sig] = partes;
  const esperado = Buffer.from(assinar(`${id}.${exp}`));
  const recebido = Buffer.from(sig);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
  await connection(); // exigido pelo Next para ler a hora atual
  if (Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}

/** Empresa logada; sem sessão válida, redireciona para o login. */
export async function empresaAtual() {
  const id = await empresaIdAtual();
  const empresa = id && (await db.empresa.findUnique({ where: { id }, include: { plano: true } }));
  if (!empresa) redirect("/login");
  return empresa;
}
