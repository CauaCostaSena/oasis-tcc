"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { cnpjValido } from "@/lib/cnpj";
import { criarSessao, encerrarSessao } from "@/lib/session";

// `valores` devolve o que foi digitado (nunca a senha), pois o React limpa o formulário após a ação.
export type Estado = { erro?: string; valores?: Record<string, string> } | undefined;

const campo = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const HASH_FALSO = bcrypt.hashSync("oasis-sem-conta", 10);

export async function cadastrar(_: Estado, f: FormData): Promise<Estado> {
  const nome = campo(f, "nome");
  const cnpj = campo(f, "cnpj").replace(/\D/g, "");
  const email = campo(f, "email").toLowerCase();
  const senha = String(f.get("senha") ?? "");
  const valores = { nome, cnpj: campo(f, "cnpj"), email };

  if (nome.length < 2) return { erro: "Informe o nome da empresa.", valores };
  if (!cnpjValido(cnpj)) return { erro: "CNPJ inválido.", valores };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { erro: "E-mail inválido.", valores };
  if (senha.length < 8) return { erro: "A senha deve ter pelo menos 8 caracteres.", valores };

  // Limites provisórios; -1 significa ilimitado.
  const gratuito = await db.plano.upsert({
    where: { nome: "Gratuito" },
    update: {},
    create: { nome: "Gratuito", limiteBuscasMes: 20, limiteFavoritos: 10, limiteRecrutadores: 2, limiteComparar: 2 },
  });

  let id: number;
  try {
    ({ id } = await db.empresa.create({
      data: { nome, cnpj, email, senhaHash: await bcrypt.hash(senha, 10), planoId: gratuito.id },
    }));
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { erro: "Já existe uma empresa com esse e-mail ou CNPJ.", valores };
    }
    throw e;
  }

  await criarSessao(id);
  redirect("/perfis");
}

export async function entrar(_: Estado, f: FormData): Promise<Estado> {
  const email = campo(f, "email").toLowerCase();
  const senha = String(f.get("senha") ?? "");
  const empresa = await db.empresa.findUnique({ where: { email } });

  // Sempre roda o bcrypt (contra um hash falso se o e-mail não existe), para a resposta
  // demorar o mesmo e não revelar quais e-mails têm conta. Mesma mensagem nos dois casos.
  const senhaOk = await bcrypt.compare(senha, empresa?.senhaHash ?? HASH_FALSO);
  if (!empresa || !senhaOk) {
    return { erro: "E-mail ou senha incorretos.", valores: { email } };
  }

  await criarSessao(empresa.id);
  redirect("/perfis");
}

export async function sair() {
  await encerrarSessao();
  redirect("/");
}
