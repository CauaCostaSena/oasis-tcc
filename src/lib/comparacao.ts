import "server-only";
import { analisar } from "./analise";
import { LOGIN_VALIDO, obterPerfil, obterRepos } from "./github";
import type { ItemComparacao } from "./metricas";

/** Normaliza o que veio da URL: só logins válidos, sem repetir, no máximo o limite do plano. */
export function loginsDaUrl(v: string | string[] | undefined, max: number): string[] {
  const lista = Array.isArray(v) ? v : v ? [v] : [];
  return [...new Set(lista.map((l) => l.trim()).filter((l) => LOGIN_VALIDO.test(l)))].slice(0, max);
}

/** Perfil + análise dos 100 repositórios mais recentes (forks não entram nas contas). */
export async function analisarCandidato(login: string): Promise<ItemComparacao | null> {
  const perfil = await obterPerfil(login);
  if (!perfil) return null;
  return { perfil, analise: analisar(perfil, await obterRepos(login)) };
}

export async function montarComparacao(logins: string[]): Promise<ItemComparacao[]> {
  return (await Promise.all(logins.map(analisarCandidato))).filter((i): i is ItemComparacao => i !== null);
}
