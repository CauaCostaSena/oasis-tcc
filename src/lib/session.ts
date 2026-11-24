import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "./db";

const COOKIE = "oasis_sessao";
const COOKIE_PERFIL = "oasis_recrutador";
const DURACAO_S = 60 * 60 * 24 * 7;

const assinar = (v: string) =>
  createHmac("sha256", process.env.SESSION_SECRET!).update(v).digest("base64url");

async function gravar(nome: string, id: number) {
  const valor = `${id}.${Math.floor(Date.now() / 1000) + DURACAO_S}`;
  (await cookies()).set(nome, `${valor}.${assinar(valor)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURACAO_S,
    path: "/",
  });
}

/** Id guardado no cookie, ou null se não existir, for adulterado ou expirou. */
async function ler(nome: string): Promise<number | null> {
  const c = (await cookies()).get(nome)?.value;
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

export async function criarSessao(empresaId: number) {
  await gravar(COOKIE, empresaId);
  (await cookies()).delete(COOKIE_PERFIL); // novo login: escolher o perfil de novo
}

export const entrarComoRecrutador = (id: number) => gravar(COOKIE_PERFIL, id);
export async function sairDoPerfil() {
  (await cookies()).delete(COOKIE_PERFIL);
}

export async function encerrarSessao() {
  const c = await cookies();
  c.delete(COOKIE);
  c.delete(COOKIE_PERFIL);
}

export const empresaIdAtual = () => ler(COOKIE);

/** Empresa logada (sem exigir perfil); sem sessão válida, redireciona para o login. */
export async function empresaSemPerfil() {
  const id = await empresaIdAtual();
  const empresa =
    id &&
    (await db.empresa.findUnique({
      where: { id },
      include: { plano: true, recrutadores: { orderBy: { id: "asc" } } },
    }));
  if (!empresa) redirect("/login");
  return empresa;
}

/** Empresa + recrutador ativo. Sem perfil escolhido (ou de outra empresa), vai para /perfis. */
export async function empresaAtual() {
  const empresa = await empresaSemPerfil();
  const rid = await ler(COOKIE_PERFIL);
  const recrutador = empresa.recrutadores.find((r) => r.id === rid);
  if (!recrutador) redirect("/perfis");
  return { ...empresa, recrutador };
}
